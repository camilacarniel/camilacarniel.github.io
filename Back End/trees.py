  # Função para gerar visualização de pastas
  def generate_pastas_dict(df):
    tree = {"children": []}
    for index, row in df.iterrows():
      pasta_origem = row["PastaOrigem"]
      pasta_destino = row["PastaDestino"] if row["PastaDestino"] else None
      pasta_backup = row["PastaBackup"] if row["PastaBackup"] else None

      if not any([pasta_origem, pasta_destino, pasta_backup]):
          continue 

      node_origem = {"name": pasta_origem, "children": []}  

      if pasta_destino:
          node_destino = {"name": pasta_destino}
          node_origem["children"].append(node_destino)

      if pasta_backup:
          node_backup = {"name": pasta_backup}
          node_origem["children"].append(node_backup)

      
      if not node_origem["children"]:
          node_origem["children"] = []

      tree["children"].append(node_origem)
    return tree

  def generate_apps_dict(df):
    tree = {"name": "", "children": []}

    def is_origin(pasta_origem, df):
      if (df['PastaDestino'].str.lower().isin([pasta_origem.lower()]).any() 
      or df['PastaBackup'].str.lower().isin([pasta_origem.lower()]).any()):
          return False
      return True


    # Tem filhos?
    def has_children(pasta_origem, df, current_dict, isBackup):
      for _, row in df.iterrows():
        nome_ch = row["Nome"]
        pasta_origem_ch = row["PastaOrigem"] if row["PastaOrigem"] else None
        pasta_destino_ch = row["PastaDestino"] if row["PastaDestino"] else None
        pasta_backup_ch = row["PastaBackup"] if row["PastaBackup"] else None

        if (pasta_origem 
            and pasta_origem_ch 
            and pasta_origem.lower() == pasta_origem_ch.lower()):

          # Adiciona children
          if 'children' in current_dict:
            current_dict['children'].append({'name': nome_ch})
          else:
            current_dict['children'] = [{'name': nome_ch}]
          current_dict["children"][-1]['isBackup'] = isBackup
          has_children(pasta_destino_ch, df, current_dict['children'][-1], False)
          has_children(pasta_backup_ch, df, current_dict['children'][-1], True)
        else:
           if 'children' not in current_dict:
              current_dict['children'] = []




    for _, row in df.iterrows():
      nome = row["Nome"]
      pasta_origem = row["PastaOrigem"] if row["PastaOrigem"] else None
      pasta_destino = row["PastaDestino"] if row["PastaDestino"] else None
      pasta_backup = row["PastaBackup"] if row["PastaBackup"] else None

      if is_origin(pasta_origem, df):

        # Adiciona o children
        tree['children'].append({'name': nome})
        if 'children' not in tree["children"][-1]:
           tree["children"][-1]['children'] = []
        tree["children"][-1]['isBackup'] = False

        # Começa o depth
        has_children(pasta_destino, df, tree["children"][-1], False)
        has_children(pasta_backup, df, tree["children"][-1], True)

    return tree