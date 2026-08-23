import os
import pytest

API_KEY = os.environ.get("GEMINI_API_KEY", "")


@pytest.mark.skipif(not API_KEY, reason="GEMINI_API_KEY environment variable not configured")
def test_gemini_models_availability():
    from google import genai

    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Say OK",
    )
    assert response.text is not None


if __name__ == "__main__":
    if not API_KEY:
        print("Please set GEMINI_API_KEY environment variable to run this model probe.")
    else:
        from google import genai

        client = genai.Client(api_key=API_KEY)
        for model in [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash",
        ]:
            try:
                response = client.models.generate_content(model=model, contents="Say OK")
                print(f"✅ {model}: WORKING")
                print(f"   Response: {response.text[:50]}")
            except Exception as e:
                print(f"❌ {model}: {e}")