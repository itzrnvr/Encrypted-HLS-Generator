# OVNB-Bundle Generator
### Description:
This app is written in electron and is used to generate encrypted (.OVPNB) files for the JPIPE android client. These (.OVPNB) files are encrypted bundles of OPEN-VPN CONFIG files (.OVPN).  The app is using AES256 encryption to encrypt the OVPN bundles.

### Usage:
- Click import or drag OVPN files into the window.
- Choose a name for the generated bundle.
- Click export and choose a path.

### Build Instructions:
- Go the root directory of the project, install all the modules via running `npm install`. 
- Once all modules are installed, run `npm start` to start the app.

### Packaging Instructions:
- To package the app, use `electron-packager` module and run 
`electron-packager . <appname> --platform-win32 --asar --icon=./favicon.ico`
  

- Click Import or Drag the files to import, give and name and export for the bundle.

