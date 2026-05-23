# ─── AWS ───────────────────────────────────────────────────
aws_region         = "ap-southeast-1"
aws_account_id     = ""

# ─── Networking ────────────────────────────────────────────
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# ─── RDS ───────────────────────────────────────────────────
db_instance_class  = "db.t3.micro"
db_name            = "reservation_seats"
db_username        = "postgres"
db_password        = ""

# ─── ECS ───────────────────────────────────────────────────
ecs_cpu            = 256
ecs_memory         = 512
api_image_tag      = "latest"

# ─── Domain (optional) ────────────────────────────────────
domain_name        = ""
certificate_arn    = ""

# ─── App Secrets (passed to ECS task as env vars) ─────────
google_client_id     = ""
google_client_secret = ""
jwt_secret           = ""
napas_tmn_code       = ""
napas_hash_secret    = ""
