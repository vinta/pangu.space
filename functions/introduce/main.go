package main

import (
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

// Handler is the AWS Lambda function handler
func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("request id: %s\n", request.RequestContext.RequestID)

	simpleMap := map[string]string{
		"description": "Paranoid text spacing as a service",
		"usage":       "https://github.com/vinta/pangu.space",
	}
	simpleMapJSON, _ := json.MarshalIndent(simpleMap, "", "  ")

	return events.APIGatewayProxyResponse{
		Body:       string(simpleMapJSON),
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(Handler)
}
