#!/usr/bin/bash

cp -fv /opt/apm-app-store/extras/store.spark-app.amber-pm-store.policy /usr/share/polkit-1/actions/store.spark-app.amber-pm-store.policy
xdg-mime default apm-app-store.desktop x-scheme-handler/apmstore
update-mime-database /usr/share/mime || true