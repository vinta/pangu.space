package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/vinta/pangu"
)

type spaced struct {
	Text    string `json:"text"`
	Lib     string `json:"lib"`
	Version string `json:"version"`
}

func handler(ctx context.Context, req events.LambdaFunctionURLRequest) (spaced, error) {
	return spaced{
		Text:    pangu.SpacingText(req.QueryStringParameters["t"]),
		Lib:     "pangu-go",
		Version: pangu.Version,
	}, nil
}

func main() {
	lambda.Start(handler)
}
