# Gunakan image Node.js resmi
FROM node

# Buat direktori kerja di dalam container
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh project ke container
COPY . .

# Tentukan port yang digunakan oleh Express
EXPOSE 3000

# Perintah untuk menjalankan server
CMD ["node", "index.js"]
