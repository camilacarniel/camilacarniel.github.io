from fastapi import HTTPException

# deixei como uma função separada antecipando que crescerá
def check_header(df, expected_headers = ['ID', 'Nome', 'PastaOrigem', 'PastaDestino', 'PastaBackup']):
    if list(df.columns) != expected_headers:
            raise HTTPException(status_code=400, detail="Cabeçalhos das colunas não correspondem ao esperado.")
    
