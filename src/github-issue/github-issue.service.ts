import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import { GithubIssueInputDto, GithubIssueOutputDto } from '@lambda/github-issue/github-issue.dto'

@Injectable()
export class GithubIssueService {
  private readonly logger = new Logger(GithubIssueService.name)
  constructor (
    private readonly configService: ConfigService,
  ) {}
  async process (input: GithubIssueInputDto): Promise<GithubIssueOutputDto> {
    const dummy = this.configService.get<string>('dummy')
    this.logger.log(`dummy: ${dummy}`)
    return {
      name: `${dummy} ${input.name}`
    }
  }
}
