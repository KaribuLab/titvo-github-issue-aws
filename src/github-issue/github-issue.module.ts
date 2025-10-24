import { Module } from '@nestjs/common'
import { GithubIssueService } from '@lambda/github-issue/github-issue.service'

@Module({
  providers: [GithubIssueService]
})
export class GithubIssueModule {}
