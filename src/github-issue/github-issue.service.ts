import { Inject, Injectable, Logger } from '@nestjs/common'
import { GithubIssueInputDto, GithubIssueOutputDto } from '@lambda/github-issue/github-issue.dto'
import { ParameterService } from '@lambda/parameter/parameter.service';
import { Octokit } from 'octokit';  
import Mustache from 'mustache';

@Injectable()
export class GithubIssueService {
  private readonly logger = new Logger(GithubIssueService.name)
  constructor(
    private readonly parameterService: ParameterService,
    @Inject("GITHUB_ISSUE_TEMPLATE")
    private readonly githubIssueTemplate: string,
  ) { }
  async process(input: GithubIssueInputDto): Promise<GithubIssueOutputDto> {
    try {
      const githubAccessToken = await this.parameterService.getDecryptedParameterValue('github_access_token');
      if (!githubAccessToken) {
        throw new Error('Github access token is not set');
      }
      this.logger.debug('Github access token retrieved');
      const renderedTemplate = Mustache.render(this.githubIssueTemplate, this.prepareTemplateData(input));
      const octokit = new Octokit({
        auth: githubAccessToken,
      });
      const issueTitle = `Issue encontrado en commit ${input.commitHash}`

      this.logger.debug(`Creating issue with params: ${JSON.stringify({ owner: input.repoOwner, repo: input.repoName, title: issueTitle, assignees: [input.asignee], labels: ['bug'] })}`);

      const createIssueResponse = await octokit.request(`POST /repos/{owner}/{repo}/issues`, {
        owner: input.repoOwner,
        repo: input.repoName,
        title: issueTitle,
        body: renderedTemplate,
        assignees: [
          input.asignee
        ],
        labels: [
          'bug'
        ],
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      this.logger.debug(`Create issue response: ${JSON.stringify({
        status: createIssueResponse.status,
        issueNumber: createIssueResponse.data.number,
        issueUrl: createIssueResponse.data.html_url,
        assignees: createIssueResponse.data.assignees,
        labels: createIssueResponse.data.labels
      })}`);
      if (createIssueResponse.status !== 201) {
        throw new Error(`Error creating issue ${createIssueResponse.status} ${createIssueResponse.data.body as string}`);
      }
      return {
        issueId: createIssueResponse.data.id,
        htmlURL: createIssueResponse.data.html_url,
      };
    } catch (error) {
      throw new Error(`Error creating issue: ${error}`);
    } 
  }

  private prepareTemplateData(data: GithubIssueInputDto) {
    const annotations = data.annotations || [];

    // Calcular contadores por severidad
    const severityCounts = annotations.reduce((acc, issue) => {
      const severity = issue.severity.toUpperCase();
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Mapear issues agregando campos necesarios para Mustache
    const issues = annotations.map((issue, index) => ({
      ...issue,
      index: index + 1,
      severity_lower: issue.severity.toLowerCase(),
      severity_label: this.getSeverityLabel(issue.severity)
    }));

    return {
      scan_date: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      commit_hash: data.commitHash,
      commit_url: `https://github.com/${data.repoOwner}/${data.repoName}/commit/${data.commitHash}`,
      repo_owner: data.repoOwner,
      repo_name: data.repoName,
      total_issues: annotations.length,
      critical_issues: severityCounts['CRITICAL'] || 0,
      high_issues: severityCounts['HIGH'] || 0,
      medium_issues: severityCounts['MEDIUM'] || 0,
      low_issues: severityCounts['LOW'] || 0,
      issues
    };
  }

  private getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      'CRITICAL': 'Crítico',
      'HIGH': 'Alto',
      'MEDIUM': 'Medio',
      'LOW': 'Bajo'
    };
    return labels[severity.toUpperCase()] || severity;
  }
}
