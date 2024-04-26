# Modelo a ser seguido pelo arquivo CSV
import re
from typing import Optional
from pydantic import BaseModel, field_validator


class MyModel(BaseModel):
    ID: int
    Nome: str
    PastaOrigem: str
    PastaDestino: Optional[str]
    PastaBackup: Optional[str]
    
    # Valida a válidade dos caminhos de diretórios
    @field_validator('PastaOrigem', 'PastaDestino', 'PastaBackup')    
    def valid_directory_name(cls, v):
        if v is None:
            return v
        if re.match(r'^(?:[a-zA-Z]:\\|\\\\[^\\/:*?"<>|\r\n]+\\)(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$', v):
            return v
        else:
            raise ValueError(f'Nome de diretório inválido')