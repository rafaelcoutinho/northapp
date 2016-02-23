# NorthApp

O NorthApp é o aplicativo do CopaNorth da NorthBrasil. O objetivo dele é ser  a  principal  forma  de  comunicação  da  NorthBrasil  com seus competidores. Este deve fornecer informações da CopaNorth como ranking, dados das etapas etc... além de prover meios para a inscrição dos competidores nas etapas.

A NorthBrasil escolheu fazer este aplicativo com código aberto, permitindo que qualquer desenvolvedor possa contribuir para o desenvolvimento do aplicativo. Se você deseja contribuir veja as issues em aberto, desenvolva e envie seu pull request. 

## Desenvolvimento atual:

As versões de produção serão mensais, e os sprints quinzenais. Acompanhe no Huboard o status atual do desenvolvimento.

https://huboard.com/rafaelcoutinho/northapp#/

## Aplicação

O NorthApp foi desenvolvido utilizando Ionic para maior facilidade de implantação em múltiplas plataformas. Ele consome dados do backend também disponível no github, veja o seguinte repositório para mais informações do backend:
https://github.com/rafaelcoutinho/northappadmin

### Construção do aplicativo

#### Pré-requisitos

* Bower
* Git
* npm
* 

#### Instalação

Execute o npm para instalar os componentes pendnetes
```
$ npm install
```
Execute o bower para instalar as dependências
```
$ bower install
```

Inicialize o SASS e restaure os plugins
```
$ ionic setup sass
$ ionic state restore
$ ionic io init
```

E teste o aplicativo no browser com:
```
$ ionic serve
```
