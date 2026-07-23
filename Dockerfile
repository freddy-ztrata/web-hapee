FROM nginx:alpine
ARG CACHE_BUST=20260723-01
COPY index.html /usr/share/nginx/html/index.html
COPY comparativa.html /usr/share/nginx/html/comparativa.html
COPY blog.html /usr/share/nginx/html/blog.html
COPY blog/ /usr/share/nginx/html/blog/
COPY transformacion.html /usr/share/nginx/html/transformacion.html
COPY partners.html /usr/share/nginx/html/partners.html
COPY rrss-templates.html /usr/share/nginx/html/rrss-templates.html
COPY politica-privacidad.html /usr/share/nginx/html/politica-privacidad.html
COPY terminos.html /usr/share/nginx/html/terminos.html
COPY gracias-compra.html /usr/share/nginx/html/gracias-compra.html
COPY juego.html /usr/share/nginx/html/juego.html
COPY agenda-tu-demo.html /usr/share/nginx/html/agenda-tu-demo.html
COPY agentes-ia-whatsapp.html /usr/share/nginx/html/agentes-ia-whatsapp.html
COPY demo-countdown.html /usr/share/nginx/html/demo-countdown.html
COPY planes-k9x2v7.html /usr/share/nginx/html/planes-k9x2v7.html
COPY compra-exitosa.html /usr/share/nginx/html/compra-exitosa.html
COPY img/ /usr/share/nginx/html/img/
COPY js/ /usr/share/nginx/html/js/
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml
COPY llms.txt /usr/share/nginx/html/llms.txt
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
