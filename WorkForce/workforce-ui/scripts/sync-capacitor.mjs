import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const sync = spawnSync(command, ['cap', 'sync'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (sync.error) throw sync.error;
if (sync.status !== 0) process.exit(sync.status ?? 1);

const razorpayPackageManifest = resolve(
  projectRoot,
  'ios/capacitor-cordova-ios-plugins/sources/Com.razorpay.cordova/Package.swift',
);
let manifest = readFileSync(razorpayPackageManifest, 'utf8');

const sdkPackage = '.package(url: "https://github.com/razorpay/razorpay-pod.git", from: "1.4.1")';
if (!manifest.includes(sdkPackage)) {
  const capacitorPackage = '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.4.2")';
  if (!manifest.includes(capacitorPackage)) {
    throw new Error('Could not find Capacitor dependency in the generated Razorpay package manifest.');
  }
  manifest = manifest.replace(capacitorPackage, `${capacitorPackage},\n        ${sdkPackage}`);
}

const razorpayProduct = '.product(name: "RazorpayCheckout", package: "razorpay-pod")';
if (!manifest.includes(razorpayProduct)) {
  const cordovaProduct = '.product(name: "Cordova", package: "capacitor-swift-pm")';
  if (!manifest.includes(cordovaProduct)) {
    throw new Error('Could not find Cordova target dependency in the generated Razorpay package manifest.');
  }
  manifest = manifest.replace(cordovaProduct, `${cordovaProduct},\n                ${razorpayProduct}`);
}

writeFileSync(razorpayPackageManifest, manifest);
