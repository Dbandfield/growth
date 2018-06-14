# PREREQUISITES

install npm. (google npm). I am using this to manage packages and dependencies\
install browserify. This turns npm packages into a script that can be used by browser\
`npm install -g browserify`\
install dependencies. These are listed in `package.json`. Simply run:\
`npm install`\
while in this directory

for running local dev environment, you need something that can act as a server. I have opted for python3 http module, and this is what the `dev.sh` utility script uses, but feel free to use XAMPP or node.js or whatever. If you want to use the utility here, you just need python 3 installed.

# BUILDING

`bundle.js` contains all the js scripts bundled together. This is made by running `browserify index.js > bundle.js` and what is in the repo is the latest build. If you want to run build again for whatever reason, you can run:\
`dev.sh build`

By default browserify logs errors with references to the bundled file. Obviously this is annoying if you want to debug, so if you add the `--debug` flag to browserify it will reference the pre-bundled files. USe the following to run in debug mode:\
`dev.sh dbuild`

# RUNNING LOCALLY

you need to have a server running locally to run the code. To run a python server from the http module you can just execute:\
`dev.sh server`\
Which will be avilable at the default `localhost:8000`.\

To both build and run the server use:\
`dev.sh run`

To get useful debug messages (as explained in BUILDING) use:\
`dev.sh drun`



