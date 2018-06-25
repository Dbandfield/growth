/* This is the setup script for the mongodb container.
    it is copied over in docker-compose.yml and is run
    when the container is first created 
*/

// First connect to mongo instance
var conn = new Mongo();
// create a new database
var db = conn.getDB("universedb");
// add a user to that database
db.createUser({user:'growth', 
                pwd:'xee8t6u3t', 
                roles: 
                [
                    {
                        role: 'readWrite', 
                        db: 'universedb'
                    }
                ]
            });