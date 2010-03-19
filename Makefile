
tests: kill-ssi-server run-ssi-server pause run-ssi-tests

run-ssi-tests: set-up-dbs
	./ssi-tests.js

set-up-dbs:
	cp ssi-saved.db ssi.db

run-ssi-server: set-up-dbs
	./ssi-server.js &

pause:
	sleep 0.5

kill-ssi-server:
	pkill node || echo nothing running

clean:
	rm -f fjord.db ssi.db
	ls -Flatr

distclean: kill-ssi-server clean

