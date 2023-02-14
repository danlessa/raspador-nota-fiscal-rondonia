async function login(cpf, password) {
    let token = undefined
    const URI_LOGIN = 'https://api.notalegal.sefin.ro.gov.br/nota-legal-api/api/v1/auth/login'
    // Log to console
    let body = JSON.stringify({ 'cpf': cpf, 'password': password })
    headers = { 'Content-Type': 'application/json' }
    let options = { method: 'POST', body: body, headers: headers }
    let response = await fetch(URI_LOGIN, options).then(response => response.json());
    if (response.status == 200) {
        token = response['usuario']['token']
    }
    return token
}

async function consulta_nfce(token, nfce) {

    const URI_CONSULTA_NFCE = 'https://api.notalegal.sefin.ro.gov.br/nota-legal-api/api/v1/nfce/consulta_nfce?chave_acesso_nfce=' + nfce;
    headers = {
        'Authorization': 'Bearer ' + token
    }
    let options = { method: 'POST', headers: headers }
    let response = await fetch(URI_CONSULTA_NFCE, options).then(response => response.json());
    return response

}

async function doar_nfce(token, nfce, entidade_id) {

    const URI_DOAR_NFCE = 'https://api.notalegal.sefin.ro.gov.br/nota-legal-api/api/v1/doacoes'
    body = JSON.stringify({ "doacao": { "chave_acesso": nfce, "entidade_id": entidade_id } })
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
    let options = { method: 'POST', body: body, headers: headers }
    let response = await fetch(URI_DOAR_NFCE, options).then(response => response.json()).catch(err => console.log(err));
    if (response == undefined) {
        response = {"msg": "Erro. Consultar log."}
    }
    
    return response

}

async function raspar_nfce(token, nfce) {
    const URI_RASPAR_NFCE = 'https://api.notalegal.sefin.ro.gov.br/nota-legal-api/api/v1/sorteio_raspadinha'
    body = JSON.stringify({ "chave_acesso_nfce": nfce })
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    }
    let options = { method: 'POST', body: body, headers: headers }
    let response = await fetch(URI_RASPAR_NFCE, options).then(response => response.json());
    return response
}

async function rasparClick() {

    let input_text = document.querySelector("textarea#nfs");
    let output_table = document.querySelector("table#output");

    let raw_nfs = input_text.value.trim().split("\n");
    let nfs = raw_nfs.map(s => s.split("?p=")[1].split("|")[0]);

    const cpf = document.querySelector("input#cpf").value.trim();
    const password = document.querySelector("input#password").value.trim();
    const entidade_id = document.querySelector("input#entidade_id").value.trim();
    token = await login(cpf, password);


    for (let nfce of nfs) {
        let newRow = output_table.insertRow(-1,)
        newRow.className = "result_row"

        let now = new Date()
        newCell = newRow.insertCell();
        newText = document.createTextNode(now.toISOString())
        newCell.appendChild(newText)
    
        newCell = newRow.insertCell();
        newText = document.createTextNode(nfce)
        newCell.appendChild(newText)

        response_consulta = await consulta_nfce(token, nfce);
        text_consulta = response_consulta['msg']
        if (text_consulta == undefined) {
            text_consulta = 'nf sem informação'
        }
        newCell = newRow.insertCell();
        newCell.appendChild(document.createTextNode(text_consulta))


        if (response_consulta['nfce'] != undefined) {
            if (response_consulta['nfce']['VL-TOTAL'] > 10){
                response_doar = await doar_nfce(token, nfce, entidade_id);
                response_raspar = await raspar_nfce(token, nfce);
                text_doar = response_doar['msg']
                text_raspar = response_raspar['msgm']

            }
            else {
                text_doar = "não doado - VT abaixo de R$10"
                text_raspar = "não raspado - VT abaixo de R$10"
            }
        }
        else {
            text_doar = "não doado - Não foi possível checar a NF"
            text_raspar = "não raspado - Não foi possível checar a NF"
        }


        newCell = newRow.insertCell();
        newCell.appendChild(document.createTextNode(text_doar))
        newCell = newRow.insertCell();
        newCell.appendChild(document.createTextNode(text_raspar))
        

    }
}

function limparClick(){
    document.querySelector("textarea#nfs").value = "";
}

function limparResultadosClick(){
    rows = document.querySelectorAll(".result_row")
    for (let row of rows){
        row.remove();
    }
}

document.querySelector("button#raspar").addEventListener("click", rasparClick);
document.querySelector("button#limpar").addEventListener("click", limparClick);
document.querySelector("button#limpar_resultados").addEventListener("click", limparResultadosClick);