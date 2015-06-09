#What is Flode?
Flode is a framework for sharing pictures on a local wifi hotspot.

##Requirements
To run Flode, you really only need a computer capable of running Node.js. An internet connection is preferred but not required. You might need a lot of storage space on the computer running Flode if your users are prone to uploading huge files! 

##Abstract overview
What is going on under the hood, so to speak, is a system consisting of a master server instance 
with theoretically endless amount of children nodes.

Each node is its' own web server, providing reliable and quick access to content over a local wifi hotspot. 
Everyone can download and browse content but to upload you have to create a user account which the admin has to verify.

On a specified time interval, the node connects to the master server and does the following:
1. Uploads timestamps for all its' files to the master.
2. The master server requests that each file that is newer on the node than the master be uploaded to the master.
3. The master then sends timestamps for all "offsite" files.
4. The node then does the same as the master and requests only files which are newer on the master server than is currently on the node.


##Who's behind it?
* Ludvig Ahlin-Hamberg
* Anton Granström
* Gustav Norlund
* Liam Carter
* Kristoffer Gunnarsson
* Erik Weilow

#Running Flode
To run Flode you are going to need `node` and `npm`, both of which can be found for your operating system of choice [on nodejs.org](https://nodejs.org).
After cloning the repository, execute the following commands in your favorite command line:

```shell
cd {clone-directory}
npm install
node server.js
```
You might notice that this does not work right away. We need to specify a commandline argument to tell the software whether we are running a node or a master instance.

# Running a node instance
To start a node instance with default settings, just run:
```shell
node server.js --node
```
This will start a web server running Flode at `http://localhost:3000`

However, in order to access the more advanced features such as user verification and node syncing, some options must be set.
As commandline arguments, these need to be set properly:
```shell
--admin {adminusername} --password {adminpassword} --serverport {webserverport}
```
`--serverport` defines which port the HTTP server listens on.

The rest of the configuration is done by editing the default configuration file `config/defaultnode.json`

## Configuration
A node instance takes the following configuration parameters in the configuration file (default: `config/defaultnode.json`)
* `port` - Defines which port the node connects to.
* `host` - Defines the host the node connects to.
* `segmentation` - Sets the count of timestamp data that is sent for each message.
* `basepath` - Sets the path relative to root where files are stored.
* `apikey` - Set the apikey which the node authenticates with.
* `allowedfiletypes` - An array of file-types (Looking like ´.txt´ with the preceding dot included) an instance is allowed to manage.
* `debugmessages` - Sets if debug messages are shown.

You can override configuration values easily by providing them as commandline arguments too. `"host": "localhost"` in the config file can be overriden with `--host {hosthere}`.


# Running a master instance
The master server takes a few less thing to run than a node. All you really need to do is make sure the right keys exist in `secret/keys.json`, as described below and then running the following command:
```shell
node app.js --master
```
## Configuration
A master instance takes the following configuration parameters in its' `configuration(cfg)` method:

* `port` - Defines which port the master instance listens on.
* `basepath` - Sets the path relative to root where files are stored.
* `keyfile` - Relative path to root where your api-keys are stored.
* `minimumretrytime` - Set the minimum amount of time between connects from one ip that doesn't drop them.
* `allowedfiletypes` - An array of file-types (Looking like ´.txt´ with the preceding dot included) an instance is allowed to manage.
* `debugmessages` - Sets if debug messages are shown.

#### Keyfile
The keyfile is a file defined like the example below providing api-keys for the node instances to use when connecting to the master instance:
```json
[
  { "title": "Stockholm", "apikey": "thisisaverysecretkey", "folder": "stockholm" },
  { "title": "Göteborg", "apikey": "anothersecretkey", "folder": "gothenburg"}
]
```