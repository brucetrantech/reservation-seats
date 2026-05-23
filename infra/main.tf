terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source             = "./modules/vpc"
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  project_name       = "reservation"
}

module "rds" {
  source            = "./modules/rds"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  db_instance_class = var.db_instance_class
  db_name           = var.db_name
  db_username       = var.db_username
  db_password       = var.db_password
  project_name      = "reservation"
}

module "alb" {
  source       = "./modules/alb"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.public_subnet_ids
  project_name = "reservation"
}

module "ecs" {
  source           = "./modules/ecs"
  vpc_id           = module.vpc.vpc_id
  subnet_ids       = module.vpc.private_subnet_ids
  alb_target_group = module.alb.target_group_arn
  ecs_cpu          = var.ecs_cpu
  ecs_memory       = var.ecs_memory
  api_image        = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/reservation-api:${var.api_image_tag}"
  project_name     = "reservation"

  environment_variables = {
    NODE_ENV             = "production"
    PORT                 = "3000"
    DATABASE_HOST        = module.rds.endpoint
    DATABASE_PORT        = "5432"
    DATABASE_NAME        = var.db_name
    DATABASE_USER        = var.db_username
    DATABASE_PASSWORD    = var.db_password
    DATABASE_SSL         = "true"
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    JWT_SECRET           = var.jwt_secret
    NAPAS_TMN_CODE       = var.napas_tmn_code
    NAPAS_HASH_SECRET    = var.napas_hash_secret
  }
}

module "frontend" {
  source       = "./modules/s3-cloudfront"
  project_name = "reservation"
  domain_name  = var.domain_name
}
