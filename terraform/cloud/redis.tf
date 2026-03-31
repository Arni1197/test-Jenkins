data "twc_database_preset" "app_redis_preset" {
  location = var.region
  type     = "redis"
}

resource "twc_database_cluster" "app_redis" {
  name      = "app-redis"
  type      = "redis7"
  preset_id = data.twc_database_preset.app_redis_preset.id

}