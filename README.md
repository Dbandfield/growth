# GROWTH

![Screenshot5](screenshots/5.png?raw=true "Screenshot 5")

## WHAT IS THIS?

This is a multi-user, interplanetary exploration sim. It is currently work in progress.
A universe is randomly generated with different planets that can be explored. You can travel between them by looking at them and pressing the travel button.

Video:
<p><a href="https://vimeo.com/277899546">Growth</a></p>

![Screenshot3](screenshots/3.png?raw=true "Screenshot 3")

Not implemented yet:

- Ecosystems of plants
- Users can affect the planets
- .. and more ...

## PREREQUISITES

install docker https://www.docker.com/
install npm https://www.npmjs.com/

## ACCOUNT INFO

You may need my docker credentials

## BUILDING

`run.sh` contains shortcuts to the docker commands\
To build simply run `./run.sh build`\
To build from scratch (slower but useful if the cache is causing problems) run `./run.sh rebuild`

## RUNNING LOCALLY

To start the server locally run `./run.sh start`\
To build and then start the server run `./run.sh all`

## STRUCTURE

This repo is divided into two main parts, the server side code and the client side code. I am using npm to manage packages, and both the client and server share the `node_modules/` directory.

### SERVER

The server is written in NodeJS in a Docker container. There is also another Docker container which holds a MongoDB database. The significant files and directories are:

- `Dockerfile` : contains build information for the NodeJS container. There is not a corresponding Dockerfile for the database container, as I am using a pre-made image.

- `docker-compose.yml` this contains information for docker-compose to coordinate the two containers

- `app.js` the main server file. This is the entry point for the container.

- `server-lib/` this contains local .js files used by `app.js`.

- `routes/` contains routes for when the client requests a page.

- `setup-db.js` is a script handed over to the MongoDB container to add a user with correct priviliges before we connect.

### CLIENT

The client uses npm to manage packages, by using browserify to generate a bundled javascript file. I am using the three.js library to handle webGL. Unfortuantely the npm three.js package does not contain files from the `examples` directory of the main three.js repo. I have manually included the ones I need with just slight modifications to export the contents with `module.exports`. The significant files and directories include:

- `public/` : this contains all files served to the client, or that become bundled into `bundle.js`

- `index.js` : this is the main client .js file.

- `gr_*.js` : these files are .js included by `index.js`

- `public/data/` : data files, including 3D models and textures
