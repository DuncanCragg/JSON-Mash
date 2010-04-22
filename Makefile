
FJORD=../fjord

tests: kill-server run-server pause run-tests

run-tests: set-up-dbs
	./server-tests.js

set-up-dbs:
	cp site/content-saved.db site/content.db

fjord: www/js/json-mash-fjord.js

www/js/json-mash-fjord.js: simulate-node.js $(FJORD)/persistence.js $(FJORD)/networking.js $(FJORD)/fjord.js
	cat simulate-node.js $(FJORD)/persistence.js $(FJORD)/networking.js $(FJORD)/fjord.js > www/js/json-mash-fjord.js

run-server: fjord set-up-dbs
	./server.js > server.log 2>&1 &

pause:
	sleep 0.5

kill-server:
	pkill node || echo nothing running

clean: kill-server
	rm -f www/js/json-mash-fjord.js
	rm -f site/content.db server.log
	ls -Fltr

