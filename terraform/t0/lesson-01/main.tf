terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "lesson_01_bucket" {
  bucket = "lesson-01-bucket-509399601753"
  tags = {
    Environment = "lab"
  }
}