import { DynamicModule, Module } from '@nestjs/common'
import { GithubIssueService } from '@lambda/github-issue/github-issue.service'
import { ParameterModule } from '@lambda/parameter/parameter.module'
import { AwsModule } from '@lambda/aws/aws.module'

export const GITHUB_ISSUE_TEMPLATE = 'GITHUB_ISSUE_TEMPLATE'

@Module({})
export class GithubIssueModule {
  static forRoot(options: { useFactory: () => string }): DynamicModule {
    return {
      module: GithubIssueModule,
      imports: [AwsModule.forRoot(), ParameterModule.forRoot()],
      providers: [
        {
          provide: GITHUB_ISSUE_TEMPLATE,
          useFactory: options.useFactory,
        },
        GithubIssueService,
      ],
      exports: [GITHUB_ISSUE_TEMPLATE, GithubIssueService],
    }
  }
}
