FROM php:8.1-apache

# Enable headers module
RUN a2enmod headers

# Set working directory
WORKDIR /var/www/html

# Copy files
COPY . .

# Set permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
