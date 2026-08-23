import pytest


@pytest.mark.asyncio
async def test_query_returns_citations_latency_and_optional_trace(pipeline):
    response = await pipeline.query("How much annual leave?", None, True)
    assert "20" in response.answer
    assert response.sources[0].document == "leave_policy.txt"
    assert response.trace and response.trace.retrieved_chunks[0].distance == 0.12
    assert response.latency.total_ms >= response.latency.retrieval_ms


@pytest.mark.asyncio
async def test_document_management_operations(pipeline):
    docs = await pipeline.list_documents()
    assert docs.total_documents == 1
    assert docs.documents[0].filename == "leave_policy.txt"

    del_res = await pipeline.delete_document("doc")
    assert del_res.success is True

    clear_res = await pipeline.clear_all()
    assert clear_res.success is True
@pytest.mark.asyncio
async def test_query_scoped_by_document_id(pipeline):
    # Query with matching document_id
    res_scoped = await pipeline.query("How much annual leave?", None, False, document_id="doc")
    assert "20" in res_scoped.answer
    assert len(res_scoped.sources) > 0

    # Query with non-existent document_id should yield not found
    res_unmatched = await pipeline.query("How much annual leave?", None, False, document_id="non_existent_doc")
    assert "couldn't find" in res_unmatched.answer.lower()
    assert len(res_unmatched.sources) == 0

