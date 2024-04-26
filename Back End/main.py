from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from pydantic import ValidationError

from modelos import MyModel
import validações, trees


app = FastAPI()

app.add_middleware(
    # Abrindo apenas para essa situação de hackaton
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

@app.post("/uploadcsv/")
async def create_upload_file(file: UploadFile):
    # Checa formato do arquivo
    if file.filename.endswith('.csv'):
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents), sep=';')
        # Checa os headers
        validações.check_header(df)

        # Retira espaços iniciais e finais de todos os valores
        df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
        # Substitui valores inválidos por None
        df = df.applymap(lambda x: None if pd.isnull(x) or x == "" else x)
        
        data = df.to_dict('records')

        # Valida os dados
        for item in data:
            try:
                MyModel(**item)
            except ValidationError as e:
                
                raise HTTPException(status_code=400, detail=f"Erro na linha de ID {item['ID']}: {str(e)}")



        return {
            'tree': trees.generate_apps_dict(df),
            'network': trees.generate_pastas_dict(df)
            }
    else:
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido")