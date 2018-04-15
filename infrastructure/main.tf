resource "aws_api_gateway_rest_api" "pangu" {
  name = "Pangu"
}

resource "aws_api_gateway_method" "pangu_root" {
  rest_api_id   = "${aws_api_gateway_rest_api.pangu.id}"
  resource_id   = "${aws_api_gateway_rest_api.pangu.root_resource_id}"
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "pangu_root_get" {
  rest_api_id             = "${aws_api_gateway_rest_api.pangu.id}"
  resource_id             = "${aws_api_gateway_rest_api.pangu.root_resource_id}"
  http_method             = "${aws_api_gateway_method.pangu_root.http_method}"
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.apex_function_introduce}/invocations"
}

resource "aws_api_gateway_method_response" "pangu_root_get_200" {
  rest_api_id = "${aws_api_gateway_rest_api.pangu.id}"
  resource_id = "${aws_api_gateway_rest_api.pangu.root_resource_id}"
  http_method = "${aws_api_gateway_method.pangu_root.http_method}"
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_resource" "pangu_spacing_text" {
  rest_api_id = "${aws_api_gateway_rest_api.pangu.id}"
  parent_id   = "${aws_api_gateway_rest_api.pangu.root_resource_id}"
  path_part   = "spacing-text"
}

resource "aws_api_gateway_method" "pangu_spacing_text_get" {
  rest_api_id      = "${aws_api_gateway_rest_api.pangu.id}"
  resource_id      = "${aws_api_gateway_resource.pangu_spacing_text.id}"
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "pangu_spacing_text_get" {
  rest_api_id             = "${aws_api_gateway_rest_api.pangu.id}"
  resource_id             = "${aws_api_gateway_resource.pangu_spacing_text.id}"
  http_method             = "${aws_api_gateway_method.pangu_spacing_text_get.http_method}"
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/${var.apex_function_spacing_text}/invocations"
}

resource "aws_api_gateway_method_response" "pangu_spacing_text_get_200" {
  rest_api_id = "${aws_api_gateway_rest_api.pangu.id}"
  resource_id = "${aws_api_gateway_resource.pangu_spacing_text.id}"
  http_method = "${aws_api_gateway_method.pangu_spacing_text_get.http_method}"
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_deployment" "pangu" {
  depends_on = [
    "aws_api_gateway_method.pangu_root",
    "aws_api_gateway_integration.pangu_root_get",
    "aws_api_gateway_method_response.pangu_root_get_200",
    "aws_api_gateway_resource.pangu_spacing_text",
    "aws_api_gateway_method.pangu_spacing_text_get",
    "aws_api_gateway_integration.pangu_spacing_text_get",
    "aws_api_gateway_method_response.pangu_spacing_text_get_200",
  ]

  rest_api_id = "${aws_api_gateway_rest_api.pangu.id}"
  stage_name  = "v1"
}

resource "aws_lambda_permission" "pangu_root_get" {
  statement_id  = "AllowInvokeFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${var.apex_function_introduce}"
  principal     = "apigateway.amazonaws.com"

  source_arn = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.pangu.id}/*/${aws_api_gateway_integration.pangu_root_get.http_method}/"
}

resource "aws_lambda_permission" "pangu_spacing_text" {
  statement_id  = "AllowInvokeFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${var.apex_function_spacing_text}"
  principal     = "apigateway.amazonaws.com"

  source_arn = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.pangu.id}/*/${aws_api_gateway_integration.pangu_spacing_text_get.http_method}${aws_api_gateway_resource.pangu_spacing_text.path}"
}
