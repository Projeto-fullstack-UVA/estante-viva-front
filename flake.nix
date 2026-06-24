{
  description = "Vuejs and Typescript development environment";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.0";
  };
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        nativeBuildInputs = with pkgs; [
          bun
          vtsls
          prettier
          prettierd
          nodejs
          vue-language-server
          vscode-css-languageserver
          vscode-json-languageserver
          tailwindcss-language-server
        ];
      };
    };
}
