FROM node:18

# Set direktori kerja di container
WORKDIR /app

# Salin dependency config
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file proyek
COPY . .

# Pastikan port yang digunakan sama dengan di Easypanel (misal: 5000)
EXPOSE 5000

# Jalankan aplikasi
CMD ["npm", "run", "dev"]
