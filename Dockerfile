FROM nginx:alpine
ARG CACHE_BUST=20260515-16
COPY index.html /usr/share/nginx/html/index.html
COPY comparativa.html /usr/share/nginx/html/comparativa.html
COPY blog.html /usr/share/nginx/html/blog.html
COPY blog/ /usr/share/nginx/html/blog/
COPY rrss-templates.html /usr/share/nginx/html/rrss-templates.html
COPY politica-privacidad.html /usr/share/nginx/html/politica-privacidad.html
COPY terminos.html /usr/share/nginx/html/terminos.html
COPY img/ /usr/share/nginx/html/img/
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
