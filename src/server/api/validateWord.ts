import { validateWord } from '../utils/wordValidation';

export async function validateWordHandler(request: any): Promise<Response> {
  try {    
    const { word } = request.body;
    
    if (!word || typeof word !== 'string') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Word is required and must be a string' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await validateWord(word.toLowerCase());

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      word: word.toLowerCase()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🔤 SERVER: Error in validateWordHandler:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
