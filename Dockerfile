FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY img/ /usr/share/nginx/html/img/
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
EXPOSE 80
