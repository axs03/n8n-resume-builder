FROM kjarosh/latex:2025.1-small
RUN tlmgr update --self && tlmgr install enumitem titlesec titling && mktexlsr