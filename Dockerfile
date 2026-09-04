FROM nginx:alpine
ARG CACHE_BUST=20260904-01
COPY index.html /usr/share/nginx/html/index.html
COPY comparativa.html /usr/share/nginx/html/comparativa.html
COPY blog.html /usr/share/nginx/html/blog.html
COPY blog/ /usr/share/nginx/html/blog/
COPY transformacion.html /usr/share/nginx/html/transformacion.html
COPY partners.html /usr/share/nginx/html/partners.html
COPY rrss-templates.html /usr/share/nginx/html/rrss-templates.html
# OJO: las paginas se copian UNA POR UNA. Un .html nuevo commiteado sin su
# linea COPY no llega a la imagen y nginx lo sirve con el catch-all
# (try_files ... /index.html): devuelve la HOME con 200, o sea que se ve igual
# que una URL inventada y no hay error en ningun lado. Paso con
# eliminacion-datos.html, que la politica de privacidad linkea y que Meta abre
# durante el App Review. Para no volver a caer:
#   bash verificacion/paginas_en_imagen.sh
# lista las paginas commiteadas que no tienen linea COPY, contra la lista de
# las que a proposito no se publican (.paginas-locales).
COPY politica-privacidad.html /usr/share/nginx/html/politica-privacidad.html
COPY terminos.html /usr/share/nginx/html/terminos.html
COPY eliminacion-datos.html /usr/share/nginx/html/eliminacion-datos.html
COPY gracias-compra.html /usr/share/nginx/html/gracias-compra.html
COPY juego.html /usr/share/nginx/html/juego.html
COPY agenda-tu-demo.html /usr/share/nginx/html/agenda-tu-demo.html
COPY agentes-ia-whatsapp.html /usr/share/nginx/html/agentes-ia-whatsapp.html
COPY demo-countdown.html /usr/share/nginx/html/demo-countdown.html
COPY planes.html /usr/share/nginx/html/planes.html
COPY academia.html /usr/share/nginx/html/academia.html
COPY dossier-x8k4m2.html /usr/share/nginx/html/dossier-x8k4m2.html
COPY demoday-via-x7m2.html /usr/share/nginx/html/demoday-via-x7m2.html
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
