terraform {
  source = "git::https://github.com/KaribuLab/terraform-aws-parameter-upsert.git?ref=v0.7.5"
}

locals {
  serverless = read_terragrunt_config(find_in_parent_folders("serverless.hcl"))
  base_path  = "${local.serverless.locals.parameter_path}/${local.serverless.locals.stage}/infra"
}

dependency "lambda" {
  config_path = "${get_parent_terragrunt_dir()}/aws/lambda"
  mock_outputs = {
    lambda_arn    = "arn:aws:lambda:us-east-2:123456789012:function:github-issue-local"
    function_name = "github-issue-local"
  }
  mock_outputs_allowed_terraform_commands = ["init", "validate", "plan"]
}

include {
  path = find_in_parent_folders()
}

inputs = {
  base_path      = local.base_path
  binary_version = "v0.7.2"
  parameters = [
    {
      path        = "lambda/github-issue-arn"
      value       = dependency.lambda.outputs.lambda_arn
      type        = "String"
      tier        = "Standard"
      description = "Lambda ARN for github-issue"
    },
    {
      path        = "lambda/github-issue-name"
      value       = dependency.lambda.outputs.function_name
      type        = "String"
      tier        = "Standard"
      description = "Lambda name for github-issue"
    },
  ]
}
