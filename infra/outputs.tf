output "alb_dns_name" {
  description = "ALB DNS name (API endpoint)"
  value       = module.alb.dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "frontend_url" {
  description = "CloudFront distribution domain"
  value       = module.frontend.cloudfront_domain
}

output "frontend_bucket" {
  description = "S3 bucket for frontend"
  value       = module.frontend.bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.frontend.distribution_id
}
