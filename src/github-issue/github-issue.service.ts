import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { GithubIssueInputDto, GithubIssueOutputDto } from '@lambda/github-issue/github-issue.dto'
import { ParameterService } from '@lambda/parameter/parameter.service';
import { Octokit } from 'octokit';
import { EventBridgeService } from '@lambda/aws/eventbridge.service';
import Mustache from 'mustache';

@Injectable()
export class GithubIssueService {
  private readonly logger = new Logger(GithubIssueService.name)
  constructor(
    private readonly configService: ConfigService,
    private readonly parameterService: ParameterService,
    private readonly eventBridgeService: EventBridgeService,
    @Inject("GITHUB_ISSUE_TEMPLATE")
    private readonly githubIssueTemplate: string,
  ) { }
  async process(input: GithubIssueInputDto): Promise<GithubIssueOutputDto> {
    const eventBusName = this.configService.get<string>('eventBusName');
    if (!eventBusName) {
      throw new Error('Event bus name is not set');
    }
    const eventData = {
      job_id: input.jobId,
      data: {
        issue_id: 0,
        html_url: '',
      },
      success: false,
      message: 'Not executed',
    }
    try {
      const githubAccessToken = await this.parameterService.getDecryptedParameterValue('github_access_token');
      if (!githubAccessToken) {
        throw new Error('Github access token is not set');
      }
      this.logger.debug('Github access token retrieved');
      const renderedTemplate = Mustache.render(this.githubIssueTemplate, this.prepareTemplateData(input.data));
      const octokit = new Octokit({
        auth: githubAccessToken,
      });
      const issueTitle = `Issue encontrado en commit ${input.data.commitHash}`

      this.logger.debug(`Creating issue with params: ${JSON.stringify({ owner: input.data.repoOwner, repo: input.data.repoName, title: issueTitle, assignees: [input.data.asignee], labels: ['bug'] })}`);

      const createIssueResponse = await octokit.request(`POST /repos/{owner}/{repo}/issues`, {
        owner: input.data.repoOwner,
        repo: input.data.repoName,
        title: issueTitle,
        body: renderedTemplate,
        assignees: [
          input.data.asignee
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
      this.logger.debug(`EventBridge event sent for task ${input.jobId}`);
      eventData.success = true;
      eventData.message = 'Issue created successfully';
      eventData.data = {
        issue_id: createIssueResponse.data.id,
        html_url: createIssueResponse.data.html_url,
      };
    } catch (error) {
      this.logger.error(`Error creating issue: ${error}`);
      eventData.success = false;
      eventData.message = (error as Error).message ?? error as string;
    } finally {
      await this.eventBridgeService.putEvents([{
        EventBusName: eventBusName,
        Source: 'mcp.tool.github.issue',
        DetailType: 'output',
        Detail: JSON.stringify(eventData),
      }]);
    }
    return {
      jobId: eventData.job_id,
      success: eventData.success,
      message: eventData.message,
      data: {
        issueId: eventData.data.issue_id,
        htmlURL: eventData.data.html_url,
      },
    };
  }

  private prepareTemplateData(data: GithubIssueInputDto['data']) {
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
