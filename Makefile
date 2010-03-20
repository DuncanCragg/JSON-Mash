
tests: kill-server run-server pause run-tests

run-tests: set-up-dbs
	./ssi-csi-tests.js

set-up-dbs:
	cp content-saved.db content.db

run-server: set-up-dbs
	./ssi-csi.js &

pause:
	sleep 0.5

kill-server:
	pkill node || echo nothing running

clean:
	rm -f content.db
	ls -Flatr

distclean: kill-server clean

