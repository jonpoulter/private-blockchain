# private-blockchain
example using LevelDB

# Blockchain Data
### Prerequisites

Installing Node and NPM is pretty straightforward using the installer package available from the (Node.js® web site)[https://nodejs.org/en/].

### Configuring your project

- Use NPM to install project dependencies.
```
npm install
```

## Testing

To test code:
1: Open a command prompt or shell terminal after install node.js.
2: Enter a node session, also known as REPL (Read-Evaluate-Print-Loop).
```
node
```
3: Copy and paste simpleChain.js into your node session

This will instantiate a new Blockchain object called blockchain and generate 10 new blocks as well as the genesis block (11 blocks in total)

```
4: Validate blockchain
```
blockchain.validateChain();
```
