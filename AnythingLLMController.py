import requests
import json
import os
import uuid
from datetime import datetime
import pdfplumber


class AnythingLLMController:
    def __init__(self, api_base_url, api_key):
        self.api_base_url = api_base_url
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def create_thread(self, thread_name, user_id=1):
        url = self.api_base_url + '/v1/workspace/stic/thread/new'
        slug = thread_name.lower().replace(" ", "-")
        data = {
            'userId': user_id,
            'name': thread_name,
            'slug': slug
        }
        
        try:
            response = requests.post(url, headers=self.headers, data=json.dumps(data))
            if response.status_code == 200:
                thread = response.json().get('thread', {})
                print(f"El hilo '{thread.get('name')}' ha sido creado con éxito.")
                print(f"ID del hilo: {thread.get('id')}")
                print(f"Slug del hilo: {thread.get('slug')}")
                return thread
            elif response.status_code == 403:
                print("Error: No se encontró una API Key válida.")
            elif response.status_code == 400:
                print("Error: Solicitud incorrecta.")
            else:
                print(f"Error al crear el hilo. Código de estado: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error de conexión: {e}")

        return None

    def delete_thread(self, thread_name):
        slug = thread_name.lower().replace(" ", "-")
        url = f'{self.api_base_url}/workspace/stic/thread/{slug}'
        response = requests.delete(url, headers=self.headers)
        if response.status_code == 200:
            print("Hilo eliminado con éxito.")
        else:
            print(f"Error al eliminar el hilo: {response.status_code} - {response.text}")

    def list_workspaces(self):
        url = f'{self.api_base_url}/workspaces'
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            print("Workspaces:", response.json())
        else:
            print(f"Error al obtener los workspaces: {response.status_code} - {response.text}")

    def send_message(self, thread_name, content):
        thread_slug = thread_name.lower().replace(" ", "-")
        url = f"{self.api_base_url}/v1/workspace/stic/thread/{thread_slug}/chat"
        payload = {
            "role": "user",
            "message": content,
            "mode": "chat"
        }
        response = requests.post(url, headers=self.headers, json=payload)
        if response.status_code == 200:
            print("Mensaje enviado:", response.json())
        else:
            print(f"Error al enviar el mensaje: {response.status_code} - {response.json()}")

    def upload_data(self, input_file_path):
        input_file_path = os.path.expanduser(input_file_path)
        
        if not os.path.exists(input_file_path):
            print(f"Error: Archivo no encontrado. Verifica la ruta proporcionada: {input_file_path}")
            return

        unique_id = str(uuid.uuid4())
        file_name = os.path.basename(input_file_path)
        file_size = os.path.getsize(input_file_path)
        file_extension = os.path.splitext(file_name)[1].lower()

        # Determinar el tipo de archivo y extraer su contenido
        if file_extension == ".txt":
            content = self._read_text_file(input_file_path)
            word_count = self.count_words_in_text(content)
        elif file_extension == ".json":
            content = json.dumps(self._read_json_file(input_file_path), indent=4)
            word_count = self.count_words_in_text(content)
        elif file_extension == ".pdf":
            content = self._read_pdf_file(input_file_path)
            word_count = self.count_words_in_text(content)
        else:
            print(f"Tipo de archivo no soportado: {file_extension}")
            return

        chunk_source = f"localfile://{input_file_path}"
        metadata = {
            "id": unique_id,
            "url": f"file://{os.path.abspath(input_file_path)}",
            "title": file_name,
            "docAuthor": "Unknown",
            "description": "Unknown",
            "docSource": f"a {file_extension} file uploaded by the user.",
            "chunkSource": chunk_source,
            "published": datetime.now().strftime("%d/%m/%Y, %H:%M:%S"),
            "wordCount": word_count,
            "pageContent": content,
            "token_count_estimate": max(1, word_count - 119)
        }

        output_dir = os.path.expanduser("~/.config/anythingllm-desktop/storage/documents/custom-documents")
        os.makedirs(output_dir, exist_ok=True) 
        output_file_name = os.path.join(output_dir, f"{file_name}-{unique_id}.json")
        
        with open(output_file_name, "w", encoding="utf-8") as output_file:
            json.dump(metadata, output_file, indent=4)
        
        print(f"Archivo generado: {output_file_name}")

    # Método para eliminar todos los documentos
    def delete_all_data(self):
        # Definir la URL del endpoint
        url = f'{self.api_base_url}/v1/system/remove-documents'

        # Ruta donde están los documentos que deseas eliminar (localmente o en el sistema)
        directorio_documentos = os.path.expanduser('~/.config/anythingllm-desktop/storage/documents/custom-documents')

        # Verificar si el directorio existe
        if not os.path.exists(directorio_documentos):
            print(f"Error: El directorio {directorio_documentos} no existe.")
            return

        # Obtener todos los archivos dentro del directorio `custom-documents`
        documentos_a_eliminar = []
        for archivo in os.listdir(directorio_documentos):
            if archivo.endswith('.json'):  # Asegurarse de que sean archivos JSON
                documentos_a_eliminar.append(f'{directorio_documentos}/{archivo}')

        # Crear el cuerpo de la solicitud
        data = {
            "names": documentos_a_eliminar
        }

        # Realizar la solicitud DELETE
        response = requests.delete(url, headers=self.headers, data=json.dumps(data))

        # Comprobar la respuesta
        if response.status_code == 200:
            print('Todos los documentos han sido eliminados exitosamente.')
        elif response.status_code == 403:
            print('Error: API Key inválida.')
        else:
            print(f'Error: {response.status_code} - {response.text}')
    

    def update_embeddings(self, slug):
        url = f'{self.api_base_url}/v1/workspace/{slug}/update-embeddings'
        directory = os.path.expanduser("~/.config/anythingllm-desktop/storage/documents/custom-documents")
        files = [f"custom-documents/{file}" for file in os.listdir(directory) if os.path.isfile(os.path.join(directory, file))]
        data = {"adds": files}
        response = requests.post(url, headers=self.headers, json=data)
        if response.status_code == 200:
            print("Embeddings actualizados:", response.json())
        else:
            print(f"Error al actualizar embeddings: {response.status_code} - {response.text}")

    def _read_text_file(self, path):
        with open(path, "r", encoding="utf-8") as file:
            return file.read()

    def _read_json_file(self, path):
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)

    def _read_pdf_file(self, path):
        with pdfplumber.open(path) as pdf:
            return "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
    
    def count_words_in_text(self, text):
        return sum(1 for word in text.split())
    
    
############################################################################################################
# Example #
############################################################################################################

manager = AnythingLLMController(api_base_url="http://localhost:3001/api", api_key="TPF9FA3-1DR4SQH-Q0KPW92-MS0WYS7")


# Create a new thread
##manager.create_thread("test_thread")

# Delete a thread
##manager.delete_thread("test_thread")

# List all workspaces
##manager.list_workspaces()

# Send a message to a thread
##manager.send_message("test_thread", "Hello, world!")

# Upload data
##manager.upload_data("~/STIC/chatEPSEVG/menu-bar-epsevg.pdf")
##manager.upload_data("~/STIC/chatEPSEVG/Manual d'instal·lació dels equips informàtics.pdf")

# Update embeddings
##manager.update_embeddings("stic")

# Delete all data
##manager.delete_all_data()
