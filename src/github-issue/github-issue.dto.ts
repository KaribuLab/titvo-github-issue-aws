export enum ReportStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
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
  taskId: string
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
  taskId: string
  success: boolean
  message: string
  data: {
    issueId: number
    htmlURL: string
  }
}