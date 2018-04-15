data "aws_caller_identity" "current" {}

variable "aws_region" {}
variable "apex_environment" {}
variable "apex_function_role" {}

variable "apex_function_arns" {
  type = "map"
}

variable "apex_function_names" {
  type = "map"
}

variable "apex_function_introduce" {}
variable "apex_function_spacing_text" {}
