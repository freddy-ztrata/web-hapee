FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY politica-privacidad.html /usr/share/nginx/html/politica-privacidad.html
COPY terminos.html /usr/share/nginx/html/terminos.html
COPY img/ /usr/share/nginx/html/img/
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
EXPOSE 80
