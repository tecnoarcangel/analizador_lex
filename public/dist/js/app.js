(function() {
    'use strict';
    angular.module('app', ['ui', 'ngSanitize']);
    angular.module('app').controller('EditorController', EditorController);
    var fileReader = function($q, $log) {
        var onLoad = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.resolve(reader.result);
                });
            };
        };
        var onError = function(reader, deferred, scope) {
            return function() {
                scope.$apply(function() {
                    deferred.reject(reader.result);
                });
            };
        };
        var onProgress = function(reader, scope) {
            return function(event) {
                scope.$broadcast("fileProgress", {
                    total: event.total,
                    loaded: event.loaded
                });
            };
        };
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
        var readAsText = function(file, scope) {
            var deferred = $q.defer();
            var reader = getReader(deferred, scope);
            reader.readAsText(file);
            return deferred.promise;
        };
        return {
            readAsText: readAsText
        };
    };
    angular.module('app').factory("fileReader", ["$q", "$log", fileReader]);
    EditorController.$inject = ['$scope', '$filter', 'lenguaje', 'automata', 'fileReader'];

    function EditorController($scope, $filter, lenguaje, automata, fileReader) {
        var vm = this;
        vm.tokens = [];
        vm.simbolos = [];
        vm.lenguaje = "js";
        vm.codigo = "";
        vm.erroresSintacticos = [];
        vm.datosSemanticos = [];
        vm.CambioEnEditor = function CambioEnEditor() {
            vm.simbolos = [];
            var arrayDeLineas = vm.codigo.split("\n");
            if (arrayDeLineas != null) {
                vm.tokens = procesarLineas(arrayDeLineas, vm.simbolos);
            }
        }
        vm.AnalisisSintactico = function AnalisisSintactico() {
            vm.erroresSintacticos = [];
            vm.tokens.forEach(function(linea, lineaIndex) {
                let cadenaTokens = [];
                if (linea.tokens.length > 0) {
                    let primerToken = linea.tokens[0];
                    let ultimoToken = linea.tokens[linea.tokens.length - 1];
                    if (lenguaje.variable.includes(primerToken.text) || primerToken.isVariable) {
                        cadenaTokens.push(primerToken);
                        linea.tokens.forEach(function(token, index) {
                            if (index == 0) {
                                return true;
                            }
                            cadenaTokens.push(token);
                        });
                        let esCadena = automata.validarAutomata(automata.automatas.variable, cadenaTokens);
                        linea.validaSintactica = esCadena;
                        if (!esCadena) {
                            let error = new Error();
                            error.tipo = AplicarSpan(primerToken.text);
                            error.linea = lineaIndex + 1;
                            if (automata.error.length > 0) {
                                error.error = "Error en elemento " + AplicarSpan(automata.error);
                            } else {
                                error.error = "Falta " + AplicarSpan(";");
                            }
                            vm.erroresSintacticos.push(error);
                        }
                        return true;
                    }
                    if (lenguaje.reservadas.includes(primerToken.text)) {
                        if (primerToken.text == "if") {
                            primerToken.noConvert = true;
                            cadenaTokens.push(primerToken);
                            linea.tokens.forEach(function(token, index) {
                                if (index == 0) {
                                    return true;
                                }
                                if (automata.automatas.if.f.includes(token.text)) {
                                    token.noConvert = true;
                                    cadenaTokens.push(token);
                                } else {
                                    cadenaTokens.push(token);
                                }
                            });
                            let esCadena = automata.validarAutomata(automata.automatas.if, cadenaTokens);
                            linea.validaSintactica = esCadena;
                            if (!esCadena) {
                                let error = new Error();
                                error.tipo = AplicarSpan(primerToken.text);
                                error.linea = lineaIndex + 1;
                                if (automata.error.length > 0) {
                                    error.error = "Error en elemento " + AplicarSpan(automata.error);
                                } else {
                                    error.error = AplicarSpan("if") + " incompleto";
                                }
                                vm.erroresSintacticos.push(error);
                            }
                            return true;
                        } else if (primerToken.text == "for") {
                            primerToken.noConvert = true;
                            cadenaTokens.push(primerToken);
                            linea.tokens.forEach(function(token, index) {
                                if (index == 0) {
                                    return true;
                                }
                                if (automata.automatas.for.f.includes(token.text)) {
                                    token.noConvert = true;
                                    cadenaTokens.push(token);
                                } else {
                                    token.forceNumber = true;
                                    cadenaTokens.push(token);
                                }
                            });
                            let esCadena = automata.validarAutomata(automata.automatas.for, cadenaTokens);
                            linea.validaSintactica = esCadena;
                            if (!esCadena) {
                                let error = new Error();
                                error.tipo = AplicarSpan(primerToken.text);
                                error.linea = lineaIndex + 1;
                                if (automata.error.length > 0) {
                                    error.error = "Error en elemento " + AplicarSpan(automata.error);
                                } else {
                                    error.error = AplicarSpan("for") + " incompleto";
                                }
                                vm.erroresSintacticos.push(error);
                            }
                            return true;
                        } else if (primerToken.text == "while") {
                            primerToken.noConvert = true;
                            cadenaTokens.push(primerToken);
                            linea.tokens.forEach(function(token, index) {
                                if (index == 0) {
                                    return true;
                                } // continue
                                if (automata.automatas.while.f.includes(token.text)) {
                                    token.noConvert = true;
                                    cadenaTokens.push(token);
                                } else {
                                    token.forceBool = true;
                                    cadenaTokens.push(token);
                                }
                            });
                            let esCadena = automata.validarAutomata(automata.automatas.while, cadenaTokens);
                            linea.validaSintactica = esCadena;
                            if (!esCadena) {
                                let error = new Error();
                                error.tipo = AplicarSpan(primerToken.text);
                                error.linea = lineaIndex + 1;
                                if (automata.error.length > 0) {
                                    error.error = "Error en elemento " + AplicarSpan(automata.error);
                                } else {
                                    error.error = AplicarSpan("while") + " incompleto";
                                }
                                vm.erroresSintacticos.push(error);
                            }
                            return true;
                        } else if (primerToken.text == "do") {
                            primerToken.noConvert = true;
                            cadenaTokens.push(primerToken);
                            linea.tokens.forEach(function(token, index) {
                                if (index == 0) {
                                    return true;
                                }
                                if (automata.automatas.do.f.includes(token.text)) {
                                    token.noConvert = true;
                                    cadenaTokens.push(token);
                                } else {
                                    token.forceBool = true;
                                    cadenaTokens.push(token);
                                }
                            });
                            let esCadena = automata.validarAutomata(automata.automatas.do, cadenaTokens);
                            linea.validaSintactica = esCadena;
                            if (!esCadena) {
                                let error = new Error();
                                error.tipo = AplicarSpan(primerToken.text);
                                error.linea = lineaIndex + 1;
                                if (automata.error.length > 0) {
                                    error.error = "Error en elemento " + AplicarSpan(automata.error);
                                } else {
                                    error.error = AplicarSpan("do") + " incompleto";
                                }
                                vm.erroresSintacticos.push(error);
                            }
                            return true;
                        }
                    }
                }
            });
        }
        vm.RenderToken = function RenderToken(token) {
            if (token.length == 0) {
                return "<span class=\"badge badge-light\">Linea</span>";
            }
            return token;
        }
        vm.AnalisisSemantico = function AnalisisSemantico() {
            vm.datosSemanticos = [];
            let lineasValidas = $filter('filter')(vm.tokens, {
                validaSintactica: true
            });
            lineasValidas.forEach(function(linea, index) {
                let token = linea.tokens[0];
                if (linea.tokens.length <= 2) {
                    return true;
                }
                if (lenguaje.variable.includes(token.text) || token.isVariable) {
                    let variable;
                    let tokens;
                    if (token.isVariable) {
                        variable = linea.tokens[0];
                        tokens = linea.tokens.slice(2);
                    } else {
                        variable = linea.tokens[1];
                        tokens = linea.tokens.slice(3);
                    }
                    let variables = ObtenerVariables(tokens);
                    let data = new SimboloSemantico();
                    tokens.pop();
                    data.nombre = variable.text;
                    data.linea = token.fila + 1;
                    data.valor = JoinTokens(tokens);
                    data.apariciones.push(token.fila + 1);
                    let variableData = $filter('filter')(vm.datosSemanticos, {
                        nombre: variable.text
                    });
                    if (variables.length == 0) {
                        let variableValida = $filter('filter')(variableData, {
                            valido: true
                        });
                        if (tokens.length == 1) {
                            let tokenTipo = tokens[0];
                            if (tokenTipo.isNumber) {
                                data.tipo = "numeric";
                            } else if (tokenTipo.isString) {
                                data.tipo = "string";
                            } else if (tokenTipo.isBool) {
                                data.tipo = "bool";
                            }
                        } else {
                            data.tipo = "mixto";
                        }
                        data.tipo = AplicarSpan(data.tipo);
                        if (!token.isVariable) {
                            if ((variableData == undefined || variableData.length == 0) || (variableValida == undefined || variableValida.length == 0)) {
                                data.valido = true;
                                vm.datosSemanticos.push(data);
                            } else {
                                if (!token.isVariable) {
                                    data.mensaje = "La variable ya esta definida";
                                    data.valido = false;
                                }
                                vm.datosSemanticos.push(data);
                                variableData.forEach(function(dataExistente, dataIndex) {
                                    dataExistente.apariciones.push(token.fila +1);
                                });
                            }
                        } else {
                            if ((variableData == undefined || variableData.length == 0) || (variableValida == undefined || variableValida.length == 0)) {
                                data.valido = false;
                                data.mensaje += "\nVariable no definida: " + AplicarSpan(token.text);
                                vm.datosSemanticos.push(data);
                            }
                        }
                    } else {
                        data.tipo = "mixto";
                        data.tipo = AplicarSpan(data.tipo);
                        variables.forEach(function(variableUsada, variableIndex) {
                            let variableData = $filter('filter')(vm.datosSemanticos, {
                                nombre: variableUsada.text
                            });
                            let variableValida = $filter('filter')(variableData, {
                                valido: true
                            });
                            if ((variableData == undefined || variableData.length == 0) || (variableValida == undefined || variableValida.length == 0)) {
                                data.valido = false;
                                data.mensaje += "\nVariable no definida: " + AplicarSpan(variableUsada.text);
                                return false;
                            } else {
                                let originalData = variableValida[0];
                                originalData.apariciones.push(token.fila + 1);
                            }
                        });
                        if (variableData == undefined || variableData.length == 0) {} else {
                            if (!token.isVariable) {
                                data.mensaje += "\nLa variable ya esta definida";
                                data.valido = false;
                            }
                            variableData.forEach(function(dataExistente, dataIndex) {
                                dataExistente.apariciones.push(token.fila + 1);
                            });
                        }
                        vm.datosSemanticos.push(data);
                    }
                } else if (lenguaje.reservadas.includes(token.text)) {
                    let tokens = linea.tokens;
                    let variables = ObtenerVariables(tokens);
                    let data = new SimboloSemantico();
                    data.tipo = AplicarSpan(token.text);
                    data.linea = token.fila + 1;
                    variables.forEach(function(variableUsada, variableIndex) {
                        let variableData = $filter('filter')(vm.datosSemanticos, function (value) {                        	
                        	if (value.nombre == variableUsada.text) {
                        		return true;
                        	}
                        	return false;
                        });
                        let variableValida = $filter('filter')(variableData, {
                            valido: true
                        });
                        if ((variableData == undefined || variableData.length == 0) || (variableValida == undefined || variableValida.length == 0)) {
                            data.valido = false;
                            data.mensaje += "\nVariable no definida: " + AplicarSpan(variableUsada.text);
                            return false;
                        } else {
                            let originalData = variableValida[0];
                            originalData.apariciones.push(token.fila + 1);
                        }
                    });
                    vm.datosSemanticos.push(data);
                }
            });
        }

        vm.CambioDeLenguaje = function() {
            CambiarEntorno(vm.lenguaje)
        }

        function CambiarEntorno(lenguaje) {
            // body...
            // TODO not supported yet, just JS
        }

        function JoinTokens(tokens) {
            let text = "";
            tokens.forEach(function(token, index) {
                text += token.text + " ";
            });
            return text;
        }

        function ObtenerVariables(tokens) {
            let variables = $filter('filter')(tokens, {
                isVariable: true
            });
            return variables;
        }
        
        $scope.getFile = function() {
            $scope.progress = 0;
            fileReader.readAsText($scope.file, $scope).then(function(result) {
                vm.codigo = result;
            });
        };
        $scope.$on("fileProgress", function(e, progress) {
            $scope.progress = progress.loaded / progress.total;
        });
      
        function procesarLineas(lineas, simbolos) {
            var tokenEnLineas = [];
           
            for (var lineaIndex = 0; lineaIndex < lineas.length; lineaIndex++) {
                var lineaActual = lineas[lineaIndex];
               
                var lineaActualTokens = [];
                var lineaString = "";
                console.log(lineaActual);
                var esSeparador = false;
                var esToken = false;
                var tokenActual = "";
                var token = new Token();
                var tokenPrevio = new Token();
                var vieneDeOperador = false;
                var vieneDeLiteral = false;
                var vieneDePunto = false;
                var incluyeApertura = false;
              
                for (var caracterIndex = 0; caracterIndex < lineaActual.length; caracterIndex++) {
                    var caracterActual = lineaActual[caracterIndex];
                    
                    if (lenguaje.literales.includes(caracterActual)) {
                        if (vieneDeLiteral) {
                            token.text = tokenActual + caracterActual;
                            token.isString = true;
                            token.fila = lineaIndex;
                            lineaActualTokens.push(token);
                            tokenActual = "";
                            tokenPrevio = token;
                            token = new Token();
                            tokenActual = "";
                            vieneDeLiteral = false;
                            vieneDeOperador = false;
                            continue;
                        } else {
                            vieneDeLiteral = true;
                        }
                    }
                 
                    if (vieneDeLiteral) {
                        tokenActual += caracterActual;
                        continue;
                    }
                    if (/\s/.test(caracterActual)) { 
                        if (tokenActual.length == 0) {
                            continue;
                        } else {
                            esSeparador = true;
                            token.text = tokenActual;
                            token.fila = lineaIndex;
                            lineaActualTokens.push(token);
                            tokenActual = ""; 
                            tokenPrevio = token;
                            token = new Token();
                            vieneDeOperador = false;
                            vieneDeLiteral = false;
                            if (lenguaje.asignador.includes(tokenPrevio.text)) {
                                tokenPrevio.isAssign = true;
                            }
                        }
                    } else {
                        if (/\//.test(caracterActual)) {                           
                            var siguienteToken = lineaActual[caracterIndex + 1];
                            if (/\//.test(siguienteToken)) {
                                if (tokenActual.length != 0) {
                                    token.text = tokenActual;
                                    token.fila = lineaIndex;
                                    lineaActualTokens.push(token);
                                    tokenActual = "";
                                    tokenPrevio = token;
                                    token = new Token();
                                    tokenActual = "";
                                    vieneDeOperador = false;
                                }
                                break;
                            }
                        }
                        if (lenguaje.separador.includes(caracterActual)) {
                            if (caracterActual == lenguaje.propiedad) {
                                token.isClass = true;
                            }
                            if (caracterActual == lenguaje.argumento) {
                                token.isArgument = true;
                            }
                            if (!vieneDeOperador && tokenActual.length > 0) {
                                if (!isNaN(tokenActual) && caracterActual == lenguaje.propiedad) {
                                    tokenActual += caracterActual;
                                    token.isClass = false;
                                    continue;
                                }
                                token.text = tokenActual;
                                token.fila = lineaIndex;
                                lineaActualTokens.push(token);
                                tokenActual = "";
                                tokenPrevio = token;
                                token = new Token();
                                tokenActual = "";
                                vieneDeOperador = false;
                            }
                            if (lenguaje.separadorCombinado.includes(caracterActual)) {
                                tokenActual += caracterActual;
                                vieneDeOperador = true;
                            } else {
                                if (tokenActual.length > 0) {
                                    token.text = tokenActual;
                                    token.fila = lineaIndex;
                                    lineaActualTokens.push(token);
                                    tokenActual = "";
                                    tokenPrevio = token;
                                    token = new Token();
                                }
                                token.text = caracterActual;
                                token.fila = lineaIndex;
                                lineaActualTokens.push(token);
                                tokenActual = "";
                                tokenPrevio = token;
                                token = new Token();
                                vieneDeOperador = false;
                                if (caracterActual == lenguaje.propiedad) {
                                    token.isProperty = true;
                                }
                                if (caracterActual == lenguaje.argumento) {
                                    token.isArgument = true;
                                }
                            }
                            if (lenguaje.asignador.includes(tokenPrevio.text)) {
                                tokenPrevio.isAssign = true;
                            }
                        } else {
                            if (vieneDeOperador) {
                                token.text = tokenActual;
                                token.fila = lineaIndex;
                                lineaActualTokens.push(token);
                                tokenActual = "";
                                tokenPrevio = token;
                                token = new Token();
                                vieneDeOperador = false;
                                if (lenguaje.asignador.includes(tokenPrevio.text)) {
                                    tokenPrevio.isAssign = true;
                                }
                            }
                            if (caracterActual == lenguaje.abrirMetodo || caracterActual == lenguaje.cerrarMetodo || caracterActual == lenguaje.abrirBloque || caracterActual == lenguaje.cerrarBloque) {
                                if (tokenActual.length != 0) {
                                    token.text = tokenActual;
                                    if (caracterActual == lenguaje.abrirMetodo) {
                                        token.isMethod = true;
                                    }
                                    token.fila = lineaIndex;
                                    lineaActualTokens.push(token);
                                    token = new Token;
                                }
                                token.text = caracterActual;
                                token.fila = lineaIndex;
                                lineaActualTokens.push(token);
                                tokenPrevio = token;
                                tokenActual = "";
                                token = new Token();
                            } else {
                                vieneDeOperador = false;
                                esSeparador = false;
                                tokenActual += caracterActual;
                            }
                        }
                    }
                }
                if (tokenActual.length > 0) {
                    token.text = tokenActual;
                    token.fila = lineaIndex;
                    lineaActualTokens.push(token);
                    tokenActual = "";
                    tokenPrevio = token;
                    token = new Token();
                }
                let linea = {
                    validaSintactica: false,
                    string: ProcesarTokens(lineaActualTokens, simbolos),
                    tokens: lineaActualTokens
                }
                tokenEnLineas.push(linea);
            }
            console.log(tokenEnLineas);
            return tokenEnLineas;
        }
        function ProcesarTokens(tokens, simbolos) {
            let texto = "";
            for (var i = 0; i < tokens.length; i++) {
                let token = tokens[i];
                let tokenText = token.text;
                token.isVariable = false;
                if (lenguaje.reservadas.includes(tokenText)) {
                    token.isReserved = true;
                    token.isVariable = false;
                    texto += tokenText + AplicarSpan("keyword") + " ";
                    continue;
                }
                if (tokenText == "true" || tokenText == "false") {
                    token.isBool = true;
                    texto += tokenText + AplicarSpan("bool") + " ";
                    continue;
                }
                if (token.isString) {
                    token.isVariable = false;
                    texto += tokenText + AplicarSpan("string") + " ";
                    continue;
                }
                if (/^-?[0-9]\d*(\.\d+)?(?:e-?\d+)?$/.test(tokenText)) {
                    token.isNumber = true;
                    token.isVariable = false;
                    texto += tokenText + AplicarSpan("numero") + " ";
                    continue;
                }
                // variable
                if (/[a-zA-Z_$][0-9a-zA-Z_$]*/.test(tokenText)) {
                    token.isVariable = true;
                    if (token.isClass) {
                        texto += tokenText + AplicarSpan("objeto") + " ";
                    } else if (token.isProperty) {
                        texto += tokenText + AplicarSpan("miembro") + " ";
                    } else if (token.isArgument) {
                        texto += tokenText + AplicarSpan("argumento") + " ";
                    } else if (token.isMethod) {
                        texto += tokenText + AplicarSpan("metodo") + " ";
                    } else {
                        texto += tokenText + AplicarSpan("variable") + " ";
                        token.isVariable = true;
                        let simbolo = new Simbolo();
                        simbolo.nombre = tokenText;
                        simbolo.linea = token.fila;
                        simbolos.push(simbolo);
                    }
                    continue;
                }
                if (lenguaje.operador.includes(tokenText)) {
                    token.isOperator = true;
                    texto += tokenText + AplicarSpan("operador") + " ";
                    continue;
                }
                if (lenguaje.logical.includes(tokenText)) {
                    token.isOperator = true;
                    token.isLogical = true;
                    texto += tokenText + AplicarSpan("logico") + " ";
                    continue;
                }
                if (tokenText.length == 1) {
                    token.isSimbol = true;
                    texto += tokenText + AplicarSpan("simbolo") + " ";
                    continue;
                }
                token.isUnknown = true;
                texto += tokenText + AplicarSpan("desconocido") + " ";
            }
            return texto;
        }

        function AplicarSpan(texto, tipo) {
            if (tipo == null) {
                tipo = "light";
            }
            return "<span class=\"badge badge-" + tipo + "\">" + texto + "</span>"
        }
    }
    angular.module('app').directive("ngFileSelect", function() {
        return {
            template: '<input type="file" id="selectedFile" style="display: none;" />' + '<ng-transclude></ng-transclude>',
            transclude: true,
            link: function($scope, el) {
                el.bind("change", function(e) {
                    $scope.file = (e.srcElement || e.target).files[0];
                    $scope.getFile();
                })
            }
        }
    });
    angular.module('app').value('ui.config', {
        codemirror: {
            mode: 'text/javascript',
            lineNumbers: true
        }
    });
    class Token {
        text = "";
        isVariable = true;
        isReserved = false;
        isClass = false;
        isProperty = false;
        isArgument = false;
        isMethod = false;
        isAssign = false;
        isOperator = false;
        isLogical = false;
        isSimbol = false;
        isBool = false;
        isString = false;
        isUnknown = false;
        isNumber = false;
        value = "";
        fila = 0;
        noConvert = false;
        forceNumber = false;
    }
    class Simbolo {
        nombre = "";
        linea = "";
        valor = "";
    }
    class Error {
        linea = 0
        posicion = 0;
        error = "";
        tipo = "";
    }
    class SimboloSemantico {
        nombre = "";
        linea = 0;
        valor = "";
        apariciones = [];
        valido = true;
        mensaje = "";
        tipo = "";
    }
})();