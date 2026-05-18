FROM alpine:3.19

# Ce service est un placeholder en attendant l'application mobile React Native / Flutter.
# Son seul rôle est de déposer un fichier client.apk sur le volume partagé avec client_web,
# qui le sert ensuite à l'URL http://localhost:8081/client.apk (requis par le sujet).
RUN echo "AREA Mobile — build placeholder" > /tmp/client.apk

VOLUME ["/output"]

CMD ["cp", "/tmp/client.apk", "/output/client.apk"]
