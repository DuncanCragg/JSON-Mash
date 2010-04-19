
tests: kill-server run-server pause run-tests

run-tests: set-up-dbs
	./server-tests.js

set-up-dbs:
	cp content-saved.db content.db

run-server: set-up-dbs
	./server.js > server.log 2>&1 &

pause:
	sleep 0.5

kill-server:
	pkill node || echo nothing running

clean: kill-server
	rm -f content.db server.log
	ls -Flatr

