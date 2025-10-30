export enum ReportStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
}

export class Annotation {
  title: string
  description: string
  severity: string
  path: string
  line: number
  summary: string
  recommendation: string
}

export class GithubIssueInputDto {
  jobId: string
  data: {
    repoOwner: string
    repoName: string
    asignee: string
    commitHash: string
    status: ReportStatus
    annotations: Annotation[]
  }
}
export class GithubIssueOutputDto {
  jobId: string
  success: boolean
  message: string
  data: {
    issueId: number
    htmlURL: string
  }
}