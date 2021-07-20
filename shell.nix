let nixpkgs = import <nixpkgs>{};
in
with nixpkgs;
with stdenv;
with stdenv.lib;
mkShell {
  name = "embed-sdk";
  buildInputs =[nodejs-14_x yarn];
}
