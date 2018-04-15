package main

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vinta/pangu"
)

var (
	// ErrTextNotProvided is thrown when text is not provided in HTTP query string
	ErrTextNotProvided = errors.New("No text was provided in HTTP query string")
)

// Handler is the AWS Lambda function handler
func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("request id: %s\n", request.RequestContext.RequestID)

	text, ok := request.QueryStringParameters["t"]
	if !ok {
		errMap := map[string]string{
			"message": ErrTextNotProvided.Error(),
		}
		errMapJSON, _ := json.MarshalIndent(errMap, "", "  ")

		return events.APIGatewayProxyResponse{
			Body:       string(errMapJSON),
			StatusCode: 400,
		}, nil
	}

	log.Printf("text: %s\n", text)

	textPlainHeaders := map[string]string{
		"content-type": "text/plain; charset=utf-8",
	}

	return events.APIGatewayProxyResponse{
		Body:       pangu.SpacingText(text),
		Headers:    textPlainHeaders,
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(Handler)
}
