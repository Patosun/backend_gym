docker run -d \
  --name gymmaster-db \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=gymmaster \
  -p 5432:5432 \
  postgres
